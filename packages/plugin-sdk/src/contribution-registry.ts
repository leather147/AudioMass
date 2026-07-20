import { PluginError } from './errors.js';
import type {
  CommandContribution,
  Disposable,
  EffectContribution,
  PanelContribution,
} from './types.js';

interface OwnedContribution<Contribution> {
  contribution: Contribution;
  owner: string;
}

export class ContributionRegistry<Contribution extends { id: string }> {
  private readonly contributions = new Map<string, OwnedContribution<Contribution>>();

  register(owner: string, contribution: Contribution): Disposable {
    if (!contribution.id.startsWith(`${owner}.`)) {
      throw new PluginError(
        'CONTRIBUTION_CONFLICT',
        `Contribution ${contribution.id} must be namespaced by ${owner}.`,
      );
    }
    if (this.contributions.has(contribution.id)) {
      throw new PluginError(
        'CONTRIBUTION_CONFLICT',
        `Contribution ${contribution.id} is already registered.`,
      );
    }
    this.contributions.set(contribution.id, { contribution, owner });
    return {
      dispose: () => {
        this.contributions.delete(contribution.id);
      },
    };
  }

  get(id: string): Contribution | undefined {
    return this.contributions.get(id)?.contribution;
  }

  list(): readonly Contribution[] {
    return [...this.contributions.values()].map(({ contribution }) => contribution);
  }

  removeOwner(owner: string): void {
    for (const [id, value] of this.contributions) {
      if (value.owner === owner) this.contributions.delete(id);
    }
  }
}

export class CommandRegistry extends ContributionRegistry<CommandContribution> {
  async execute<Result = unknown>(id: string, argumentsValue?: unknown): Promise<Result> {
    const command = this.get(id);
    if (!command) throw new PluginError('NOT_INSTALLED', `Command ${id} is not registered.`);
    return (await command.execute(argumentsValue)) as Result;
  }
}

export class EffectRegistry extends ContributionRegistry<EffectContribution> {}
export class PanelRegistry extends ContributionRegistry<PanelContribution> {}
